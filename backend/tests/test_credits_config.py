from backend.app.core.credits_config_loader import get_action_config


def test_blueprint_generation_normalizes_required_plan():
    action = get_action_config("blueprint_generation")

    assert action is not None
    assert action["required_plan"] == "sistema"


def test_builder_first_run_normalizes_consumption_type():
    action = get_action_config("builder_first_run")

    assert action is not None
    assert action["consumption_type"] == "standard"


def test_project_deploy_uses_special_consumption():
    action = get_action_config("project_deploy")

    assert action is not None
    assert action["required_plan"] == "premium"
    assert action["consumption_type"] == "special"